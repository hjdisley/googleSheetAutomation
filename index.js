const { google } = require("googleapis");
const fetch = require("node-fetch");
const { spreadsheetId } = require("./secrets");

const updateSistrix = async () => {
  console.log(spreadsheetId);
  const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets",
  });
  const client = await auth.getClient();
  const googleSheets = google.sheets({ version: "v4", auth: client });
  const metaData = await googleSheets.spreadsheets.get({ auth, spreadsheetId });
  const getRows = await googleSheets.spreadsheets.values
    .get({
      auth,
      spreadsheetId,
      range: "allClientsData!B1:GZ1",
    })
    .then((res) => {
      // Update date in api request --------------------------------------------------------------------------------------->           <-------
      const endpoint = `https://api.sistrix.com/domain.sichtbarkeitsindex?api_key=LtADkhSEcRs5QrDrPxD84YMt2SjRUA2FgMrh&date=&04-26-2021&domain=`;
      let visibilityScore = [];
      res.data.values.flat().forEach((domain) => {
        fetch(endpoint + domain + "&format=json")
          .then((res) => res.json())
          .then((res) => {
            visibilityScore.push(
              res.answer[0].sichtbarkeitsindex[0].value +
                " " +
                res.answer[0].sichtbarkeitsindex[0].domain
            );
          });
      });
      setTimeout(() => {
        const parsedScore = visibilityScore.map((e) => e.toString());
        console.log(parsedScore);
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
      }, 10000);
    });
};
updateSistrix();
