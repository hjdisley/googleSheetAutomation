const { google } = require("googleapis");
const fetch = require("node-fetch");
const { spreadsheetId } = require("./secrets");

let visibilityScore = [];
const updateSistrix = async () => {
  const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets",
  });
  const client = await auth.getClient();
  const googleSheets = google.sheets({ version: "v4", auth: client });
  const metaData = await googleSheets.spreadsheets.get({ auth, spreadsheetId });
  const endpoint = `https://api.sistrix.com/domain.sichtbarkeitsindex?api_key=LtADkhSEcRs5QrDrPxD84YMt2SjRUA2FgMrh&date=&04-26-2021&domain=`;
  const getRows = await googleSheets.spreadsheets.values
    .get({
      auth,
      spreadsheetId,
      range: "allClientsData!B1:GZ1",
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
              // Updata cell Range ->          <-
              range: "allClientsData!B307:GZ307",
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
    fetch(endpoint + domain + "&format=json")
      .then((res) => res.json())
      .then((res) => {
        let value =
          res.answer[0].sichtbarkeitsindex[0].value +
          visibilityScore.push(value);
        console.log(value);
        resolve();
      })
      .catch((err) => console.log(err));
  });
};
