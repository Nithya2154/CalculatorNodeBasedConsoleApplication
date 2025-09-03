const fs = require("fs");
const https = require("https");
const log4js = require("log4js");
var intervalId = ''
var is_smssending = false

function getCurrentDate() {
  const date = new Date();
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = monthNames[date.getMonth()];
  const day = ("0" + date.getDate()).slice(-2);
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = ("0" + date.getMinutes()).slice(-2);
  const seconds = ("0" + date.getSeconds()).slice(-2);
  const milliseconds = ("00" + date.getMilliseconds()).slice(-3);
  const ampm = hours >= 12 ? "pm" : "am";

  hours = hours % 12;
  hours = hours ? hours : 12;

  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}:${milliseconds} ${ampm}`;
}

const timeString = getCurrentDate()
  .replace(/-/g, "")
  .replace(/:/g, "_")
  .replace(/ /g, "_");
log4js.configure({
  appenders: {
    cheeseLogs: {
      type: "file",
      filename: "SMSServer_" + timeString + ".log",
      maxLogSize: 10485760, // 10MB
      backups: 5,
    },
  },
  categories: {
    default: {
      appenders: ["cheeseLogs"],
      level: "debug",
    },
  },
});

const logger = log4js.getLogger("default");

// Server setup with improved error handling
const options = {
  key: fs.readFileSync("pri.key.txt"),
  cert: fs.readFileSync("STAR_aabsweets_com.crt"),
};

// Starting Point
const httpserver = https.createServer(options, function (req, resp) {
  // console.log(req.method, req.url);
});

httpserver.listen(9050, function () {
  console.log("Sms service running on port 9050");
  logger.info("Sms service running on port 9050");

  // Timer calling every 5 seconds

  intervalId = setInterval(() => {
    if (is_smssending == false) {
      smsObject.SendSmsPrc()
    }
  }, 5000);

  // Start task
  // SendSmsPrc();
});
// Listen End







//---------------------------------------------------------------------------------- Class SmsSent starts
class SmsSent {
  constructor() {
    this.logger = logger;
  }

  // Method 1
  async SMSAPI(smsProvider, messagesDetails) {
    try {
      // Prepare the payload based on SMS provider
      let payload = [];

      if (smsProvider[0].SMSProvider === "AirTel") {
        payload = {
          //airtel api payload
        };
        const response = await fetch(
          "airtel api urls",
          {
            method: "POST",
            ...this.getBaseRequestConfig(),
            body: JSON.stringify(payload),
            // timeout handling not built-in in fetch, use AbortController if needed
          }
        );

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const SmsApiDatas = await response.json();
        // console.log("API Response:", SmsApiDatas);
        return SmsApiDatas;
      } else if (smsProvider[0].SMSProvider === "SmartPing") {
        payload = {
         //Smartping api payload
        };

        const response = await fetch(
          "smartping api url",
          {
            method: "POST",
            ...this.getBaseRequestConfig(),
            body: JSON.stringify(payload),
          }
        );
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const SmsApiDatas = await response.json();
        //console.log("SmartPing API Response:", SmsApiDatas.statusCode);
        return SmsApiDatas;
      }
    } catch (error) {
      console.error("Error sending SMS:", error.message);
      throw error;
    }
  }

  // Method 2
  async APIGetApprovalNgFour(requestBody) {
    try {
      const fetchBody = JSON.stringify(requestBody);
      const response = await fetch(
        //"api for fecth the data from ",
        {
          method: "POST",
          ...this.getBaseRequestConfig(),
          body: fetchBody,
        }
      );

      // Check for non-200 response
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const appReqFourDatas = await response.json();

      if (!Array.isArray(appReqFourDatas)) {
        throw new Error("Invalid response format: Expected an array");
      }

      return appReqFourDatas;
    } catch (error) {
      logger.error("Error in main function:", error.message);
      return { error: error.message };
    }
  }

  // Method 3 Headers
  getBaseRequestConfig() {
    return {
      headers: {
        "x-api-key":
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfZ2tleSI6IkJSTEdOfk5pdGh5YW5hbnRoYW1Ac3dkIiwiaWF0IjoxNzU2NDQyNDU3LCJleHAiOjE3NTY1NDI0NTd9.FUbtgfeqoJLhwo6S63E8K2iLmwpML6JNuNZom_jQb0I",
        "content-type": "application/json",
        "Authorization": "Basic YWR5cm90bXBnLnRyYW5zOlJyVlhx"
      },
      strictSSL: false,
      timeout: 30000, // 30 second timeout
    };
  }

  //Method 4
  SendSmsPrc = async () => {
    is_smssending = true
    try {
      //get the smsProvider Value
      const smsProvider = await this.APIGetApprovalNgFour({
        RequestType: "GetSMSProviderToBeSent",
      });
      if (smsProvider) {
        // console.log(smsProvider[0].SMSProvider);
        //get the Messages and Phone Numbers
        const messages = await this.APIGetApprovalNgFour({
          RequestType: "GetListOfSMSToBeSent",
        });
        //using loop to sent sms to another api
        for (const details of messages) {
          try {
            let result = await this.SMSAPI(smsProvider, details); // Wait for the SMS to be sent
            if (result) {
              const update = await this.APIGetApprovalNgFour({
                RequestType: "UpdateStatusAsDone",
                TrnNo: details.TrnNo,
              });
              if (!update) {
                throw new Error("Unsuccessfull Error");
              }
            }
          } catch (err) {
            console.error(`Failed to send to ${details.smsMobile}:`, err.message);
            logger.error(`Failed to send to ${details.smsMobile}:`, err.message);
          }
        }
      }
    } catch (err) {
      is_smssending = false
      logger.error("Scheduled task error:", err.message);
    }
    is_smssending = false

  };
}
//---------------------------------------------------------------------------------- Class SmsSent Ends


// Call smsSent Class using object smsObject : hoisting.
const smsObject = new SmsSent();

