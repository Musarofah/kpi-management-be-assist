const { MongoClient } = require('mongodb');

async function test() {
  const uri = 'mongodb://sarofahmu_db_user:Assist@ac-koxwfxn-shard-00-00.gl1qexl.mongodb.net:27017,ac-koxwfxn-shard-00-01.gl1qexl.mongodb.net:27017,ac-koxwfxn-shard-00-02.gl1qexl.mongodb.net:27017/kpi_assist_id?ssl=true&authSource=admin&retryWrites=true&w=majority';
  
  console.log('Connecting with MongoClient...');
  const client = new MongoClient(uri, {
    tls: true,
    serverSelectionTimeoutMS: 5000,
  });

  try {
    await client.connect();
    console.log('🎉 MongoClient connected successfully!');
    const db = client.db('kpi_assist_id');
    const cols = await db.listCollections().toArray();
    console.log('Collections in kpi_assist_id:', cols.map(c => c.name));
    await client.close();
  } catch (err) {
    console.error('MongoClient error:', err);
  }
}

test();
