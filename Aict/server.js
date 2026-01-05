const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const DATA_FILE = path.join(__dirname, 'data', 'transactions.json');
const app = express();
app.use(cors());
app.use(bodyParser.json());

function readData(){
  try{
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  }catch(e){
    return [];
  }
}

function writeData(data){
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

app.get('/api/transactions', (req, res) => {
  const data = readData();
  res.json(data);
});

app.post('/api/transactions', (req, res) => {
  const data = readData();
  const tx = req.body;
  // ensure id unique
  if(!tx.id) tx.id = '#TXN-' + (Math.floor(Math.random()*900000)+1000);
  data.unshift(tx);
  writeData(data);
  res.status(201).json(tx);
});

app.put('/api/transactions/:id', (req, res) => {
  const data = readData();
  const id = req.params.id;
  const idx = data.findIndex(t => t.id === id);
  if(idx === -1) return res.status(404).json({ error: 'Not found' });
  data[idx] = req.body;
  writeData(data);
  res.json(data[idx]);
});

app.delete('/api/transactions/:id', (req, res) => {
  const data = readData();
  const id = req.params.id;
  const newData = data.filter(t => t.id !== id);
  writeData(newData);
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Mock API listening on port', PORT));
