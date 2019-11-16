const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const { promisify } = require('util');
//para enviar email
const sgMail = require('@sendgrid/mail');
const sendGridKey = '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';

const googleSpreadsheet = require('google-spreadsheet');
const credentials = require('./bugtracker.json');

//configuracoes
const idDoc = '1K14MPBdYAItDv0bjLRRmF2sNqGdEGCOV7APwPY8rlp0';
const worksheetIndex = 0;

app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname, 'views'));

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/',(request, response) => {
    response.render('home');
});

/* com call backs
app.post('/', (request, response) => {

    const doc = new googleSpreadsheet(idDoc);
    doc.useServiceAccountAuth(credentials, (err) => {
        if(err){
            console.log('Nao foi possivel conectar');
        }else{
            console.log('Planilha aberta');
            doc.getInfo((err, info) => {
                const worksheet = info.worksheets[worksheetIndex];
                worksheet.addRow({
                    name: request.body.name,
                    email: request.body.email,
                    issue: request.body.issue,
                    reproduzir: request.body.reproduzir,
                    esperada: request.body.esperada,
                    userDate: request.body.userDate,
                    userAgent: request.body.userAgent,
                    recebida: request.body.recebida }, err => {
                    response.send('Bug reportado com sucesso!');
                })
            })
        }
    })

})
*/


//Com promisses e assync/await
app.post('/', async(request, response) => {

    try{
        const doc = new googleSpreadsheet(idDoc);

        await promisify(doc.useServiceAccountAuth)(credentials);
        console.log('Planilha aberta');
        const info = await promisify(doc.getInfo)();
        const worksheet = info.worksheets[worksheetIndex];
        await promisify(worksheet.addRow)({
            name: request.body.name,
            email: request.body.email,
            issue: request.body.issue,
            reproduzir: request.body.reproduzir,
            esperada: request.body.esperada,
            userDate: request.body.userDate,
            userAgent: request.body.userAgent,
            source: request.query.source || 'Padrão',
            recebida: request.body.recebida
        });

        if(request.body.issue === 'CRITICAL'){
            sgMail.setApiKey(sendGridKey);
            const msg = {
            to: 'dionesmdi@gmail.com',
            from: 'dionesmdi@gmail.com',
            subject: 'Erro critico Reportado no Bugtracker',
            text: 
            `O usuario ${ request.body.name } reportou erro critico` ,
            html: `<strong>O usuario ${ request.body.name } reportou erro critico</strong>`,
            };
            await sgMail.send(msg);
        }

        response.render('sucesso');
    }catch(err){
        response.send('Erro ao enviar o formulário');
        console.log(err);
    }
                
})
    

app.listen(3000, (err) => {
    if(err){
        console.log('Ocorreu um erro no listen...', err);
    }else{
        console.log('Bugtracker rodando na porta 3000');
    }
});