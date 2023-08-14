const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'mydatabase.db');

const app = express();
const port = 3000;

app.use(bodyParser.json());


app.set('view engine', 'ejs'); // Set EJS as the view engine
app.set('views', path.join(__dirname, 'views')); // Set the directory for EJS templates

// Enable CORS for all routes
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });

const db = new sqlite3.Database(dbPath, err => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Connected to database on path',dbPath);
  }
});

app.get('/list-tables', (req, res) => {
    db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
      if (err) {
        console.error('Error retrieving table list:', err.message);
        res.status(500).json({ error: 'Error retrieving table list.' });
      } else {
        const tableNames = rows.map(row => row.name);
        res.json({ tables: tableNames });
      }
    });
  });
  
app.post('/save-url', (req, res) => {
    const { url, domain, highlighted } = req.body;
    db.run(
      "INSERT INTO data (url, domain, highlighted) VALUES (?, ?, ?)",
      [url, domain, highlighted],
      function(err) {
        if (err) {
          console.error('Error saving data to database:', err.message); // Log the error message
          res.status(500).json({ error: 'Error saving data to database.' });
        } else {
          const insertedId = this.lastID; // Get the generated primary key
          res.json({ message: 'Data saved successfully.', insertedId });
        }
      }
    );
  });
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.get('/', (req, res) => {
  db.all("SELECT id,domain,url,highlighted,datetime(timestamp, 'localtime') as timestamp FROM data ORDER BY timestamp DESC", (err, rows) => {
      if (err) {
          console.error(err);
          return res.status(500).send('An error occurred.');
      }

      const data = organizeData(rows);

      res.render('index', { domains: data });
  });

});

app.delete('/delete/:id', (req, res) => {
  const id = req.params.id;
  deleteTextById(id, res);
});

function deleteTextById(id, res) {
  db.run(
      "DELETE FROM data WHERE id = ?",
      [id],
      function(err) {
          if (err) {
              console.error('Error deleting entry from database:', err.message);
              res.status(500).json({ error: 'Error deleting data from database.', detailedError: err.message });
          } else {
              res.status(200).json({ message: 'Entry deleted successfully.', id });
          }
      }
  );
}

function organizeData(rows) {
  const organizedData = [];
  const domainMap = new Map();

  // Organize rows into domainMap
  for (const row of rows) {
      const domain = row.domain;
      const highlightedText = { text: row.highlighted, url: row.url, timestamp:row.timestamp, id:row.id };

      if (!domainMap.has(domain)) {
          domainMap.set(domain, []);
      }

      domainMap.get(domain).push(highlightedText);
  }

  // Convert domainMap to organizedData array
  for (const [domain, highlightedTexts] of domainMap) {
      organizedData.push({ domain, highlightedTexts });
  }

  return organizedData;
}


