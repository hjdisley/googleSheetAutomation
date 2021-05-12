const { google } = require("googleapis");
const { spreadsheetId,apiKey } = require("./secrets");
const fetch = require("node-fetch");

var visibilityScore = [];
const updateSistrix = async () => {
  const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets",
  });
  const client = await auth.getClient();
  const googleSheets = google.sheets({ version: "v4", auth: client });
  const metaData = await googleSheets.spreadsheets.get({ auth, spreadsheetId });
  // Change date in request ---------------------------------------------------------------->          <-------
  const endpoint = `https://api.sistrix.com/domain.sichtbarkeitsindex?api_key=${apiKey}&date=&05-03-2021&domain=`;
  const getRows = await googleSheets.spreadsheets.values
    .get({
      auth,
      spreadsheetId,
      range: "Domains!A1:HF1",
    })
    .then((res) => {
      const the_data = res.data.values.flat();
      const arrayOfPromises = the_data.map((url) => () =>
        yourMainFunction(url, endpoint)
      );
      arrayOfPromises
        .reduce(
          (promise, func) =>
            promise.then((result) =>
              func().then(Array.prototype.concat.bind(result))
            ),
          Promise.resolve([])
        )
        .then((res) => {
          const parsedScore = visibilityScore.map((e) => e.toString());
          googleSheets.spreadsheets.values
            .append({
              auth,
              spreadsheetId,
              // Updata cell Range ->    <-
              range: "allClientsData!B:HG",
              valueInputOption: "USER_ENTERED",
              resource: {
                values: [parsedScore],
              },
            })
            .catch((err) => console.log(err));
        })
        .catch((err) => console.log(err));
    })
    .catch((err) => console.log(err));
};

updateSistrix();
const yourMainFunction = (domain, endpoint) => {
  return new Promise((resolve) => {
    fetch(endpoint + domain + "&mobile=true" + "&format=json")
      .then((res) => res.json())
      .then((res) => {
        let value = res.answer[0].sichtbarkeitsindex[0].value;
        visibilityScore.push(value);
        resolve();
      })
      .catch((err) => console.log(err));
  });
};
