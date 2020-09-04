const { getAllFilePathsWithExtension, readFile } = require('./fileSystem');
const { readLine } = require('./console');

//Команда для даты в формате {yyyy[-mm-dd]}
const dateRegExp = /^date \d{4}((-(0[1-9]|1[012]))?|(-(0[1-9]|1[012])-(0[1-9]|1[0-9]|2[0-9]|3[01]))?)$/;
//Команда сортировки
const sortRegExp = /^sort (importance|user|date)$/;

app();

function app () {
    console.log('Please, write your command!');
    readLine(processCommand);
}

function processCommand (command) {
    if(command.startsWith('user')){
        console.log('user command');
    }
    else if(sortRegExp.test(command)) {
        console.log('sort command');
    }
    else if(dateRegExp.test(command)) {
        console.log('date command');
    }
    else switch (command) {
        case 'exit':
            process.exit(0);
            break;
        case 'show':
            console.log('show command');
            displayTable(createToDoStructure());
            break;
        case 'important':
            console.log('important command');
            break;
        default:
            console.log('wrong command');
            break;
    }
}

//Основная структура данных TODO комментария
function ToDoObject(importance, user, date, comment, filename){
    this.importance = importance;
    this.user = user;
    this.date = date;
    this.comment = comment;
    this.filename = filename;
}

function createToDoStructure(){
    const filesMap = getFiles();
    let toDoStructure = [];

    for (let [filePath, fileData] of filesMap.entries()) {
        let toDoObject = new ToDoObject();

        //Обрезаем имя файла
        toDoObject.filename = filePath.slice(filePath.lastIndexOf('\\') + 1);

        //Разбиваем весь текст файла на фрагменты от одного комментария до другого
        let toDoFragments = fileData.split('//').filter(textFragment => textFragment.match(/TODO/i));

        toDoFragments.forEach(function(toDoFragment, i) {
            //У каждого фрагмента отрезаем нужную часть
            let regexResult = toDoFragment.match(/TODO((\s?:\s?)|\s*)/i);
            toDoFragment = toDoFragment.slice(regexResult.index + regexResult[0].length, toDoFragment.indexOf("\n"));

            //Парсим строку: user, date, important, comment
            if(toDoFragment.includes('!')){
                toDoObject.importance = toDoFragment.match(/!/g).length;
            } else {
                toDoObject.importance = '';
            }
            if(toDoFragment.includes(';')){
                let commentSections = toDoFragment.split(';').map(section => section.trim());
                toDoObject.user = commentSections[0];
                toDoObject.date = commentSections[1];
                toDoObject.comment = commentSections[2];
            } else {
                toDoObject.user = '';
                toDoObject.date = '';
                toDoObject.comment = toDoFragment.trim();
            }

            toDoStructure.push(toDoObject);
        });
    }

    return toDoStructure;
}

function getFiles () {
    let filesMap = new Map();
    const filePaths = getAllFilePathsWithExtension(process.cwd(), 'js');
    filePaths.map(path => filesMap.set(path, readFile(path)));

    return filesMap;
}

function displayTable(toDoStructure){
    toDoStructure.forEach(function(toDoObject, i){
        console.log(toDoObject.importance + '  |  ' + toDoObject.user + '  |  ' + toDoObject.date + '  |  ' + toDoObject.comment + '  |  ' + toDoObject.filename +  '\n');
    });

}

function displayHeader(){

}

function displayLine(){

}

function displayFooter(){
  console.log('');
}
