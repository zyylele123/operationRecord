const mysql = require('./server/mysql'),
  zh = require('./server/local-zh.config'),
  //文件模块
  fs = require("fs"),
  express = require('express'),
  path = require('path'), //系统路径模块
  app = express(),
  bodyParser = require('body-parser'),
  port = 3002;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'datas')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
//配置跨域
app.all('*', function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
//查询所有表名
app.post('/', function (req, res) {
  mysql.getAllTables().then((dataBase) => {
    let msg = [];
    for (let i = 0, len = dataBase.length; i < len; i++) {
      msg.push({
        en: dataBase[i]['TABLE_NAME'],
        zh: zh[dataBase[i]['TABLE_NAME']]
      });
    };
    res.send(msg);
  });
});

//根据表名查询数据
app.get('/operationRecord/query', function (req, res, next) {
  const { table, page, pageSize } = req.query;

  mysql.query(table, page, pageSize).then((dataBase) => {
    for (let i = 0, len = dataBase.list.length; i < len; i++) {
      dataBase.list[i].dataFile = dataBase.list[i].dataFile.replace(/.\/datas\//ig, '');
    };
    res.send(dataBase);
  });
});

//添加数据
app.post('/operationRecord/add', function (req, res) {
  //获取ip
  const ip = getClientIp(req);
  //文件名
  const date = new Date().getTime();
  const fileName = `./datas/${date}.json`;
  //接收数据
  const { name, isReport, data, table } = req.body;
  writeJSON(fileName, data);
  mysql.add([name, ip, new Date(), fileName, isReport], table).then((dataBase) => {
    res.send({
      msg: 'success'
    });
  });
});

app.listen(port, () => console.log(`服务启动成功!端口号：${port}`));

/**
 * 获取客户端ip
 * @param {request} req 
 */
function getClientIp(req) {
  return req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;
};

/**
 * 写文件
 * @param {文件路径以及文件名} fileName 
 * @param {保存的数据} data 
 */
function writeJSON(fileName, rData) {
  fs.writeFile(fileName, rData, () => {
    console.log(`${fileName}写入成功`);
  });
};