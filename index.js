const { getAllFilePathsWithExtension, readFile } = require('./fileSystem');
const { readLine } = require('./console');

//Команда даты в формате {yyyy[-mm-dd]}
const dateRegExp = /^date \d{4}((-(0[1-9]|1[012]))?|(-(0[1-9]|1[012])-(0[1-9]|1[0-9]|2[0-9]|3[01]))?)$/;
//Команда сортировки
const sortRegExp = /^sort (importance|user|date)$/;
//Начало TODO комментария
const toDoRegExp = /^(\s*)TODO((\s?:\s?)|\s*)/i

let tableMaxLength = {
    importance: 1,
    user: 10,
    date: 10,
    comment: 50,
    filename: 15
}

app();

function app () {
    console.log('Please, write your command!');
    readLine(processCommand);
}

function processCommand (command) {
    if(command.startsWith('user')){
        userCommand(command.slice(5));
    }
    else if(sortRegExp.test(command)) {
        sortCommand(command.slice(5));
    }
    else if(dateRegExp.test(command)) {
        dateCommand(command.slice(5));
    }
    else switch (command) {
        case 'exit':
            process.exit(0);
            break;
        case 'show':
            showCommand();
            break;
        case 'important':
            importantCommand();
            break;
        default:
            console.log('Wrong command! \n');
            break;
    }
}

//Основная структура данных TODO комментария
function ToDoObject(importance=0, user="", date="", comment="", filename=""){
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
        toDoObject.filename = filePath.slice(filePath.lastIndexOf('/') + 1);
        //Разбиваем весь текст файла на фрагменты от одного комментария до другого, и отбираем только TODO
        let toDoFragments = fileData.split('//').filter(textFragment => textFragment.match(toDoRegExp));
        toDoFragments.forEach(toDoFragment => {
            //У каждого фрагмента отрезаем нужную часть
            let regexResult = toDoFragment.match(toDoRegExp);
            toDoFragment = toDoFragment.slice(regexResult.index + regexResult[0].length, toDoFragment.indexOf("\n"));
            //Парсим комментарий TODO: user, date, important, comment
            if(toDoFragment.includes('!')){
                toDoObject.importance = toDoFragment.match(/!/g).length;
            } else {
                toDoObject.importance = 0;
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
    filePaths.forEach(path => filesMap.set(path, readFile(path)));

    return filesMap;
}

function showCommand(){
    displayTable(createToDoStructure());
}

function importantCommand(){
    let importantFilteredArr = createToDoStructure().filter(toDoObject => !!toDoObject.importance);
    displayTable(importantFilteredArr);
}

function userCommand(command){
    let userRegExp = new RegExp('^' + command,'i')
    let userFilteredArr = createToDoStructure().filter(toDoObject => toDoObject.user.match(userRegExp));
    displayTable(userFilteredArr);
}

function sortCommand(command){
    let sortedArr = [];
    switch(command){
        case 'importance':
            sortedArr = createToDoStructure().sort((firstToDo,secondToDo) => secondToDo.importance - firstToDo.importance);
            break;
        case 'user':
            sortedArr = createToDoStructure().sort((firstToDo,secondToDo) => {
                if(!firstToDo)
                    return 1;
                if(!secondToDo)
                    return -1;
                if(!firstToDo && !secondToDo)
                    return 0;
                else
                    return firstToDo.user.localeCompare(secondToDo.user);
            });
            break;
        case 'date':
            sortedArr = createToDoStructure().sort((firstToDo,secondToDo) => {
                if(!firstToDo)
                    return 1;
                if(!secondToDo)
                    return -1;
                if(!firstToDo && !secondToDo)
                    return 0;
                else
                return new Date(secondToDo.date) - new Date(firstToDo.date);
            });
            break;
    }
    displayTable(sortedArr);
}

function dateCommand(command){
    let dateFilteredArr = createToDoStructure().filter(toDoObject => new Date(toDoObject.date) >= new Date(command));
    displayTable(dateFilteredArr);
}

function displayTable(toDoStructure){
    //Вычисляем максимальную ширину столбцов
    let tableLength = [1, 4, 4, 7, 8];
    toDoStructure.forEach(toDoObject => {
        tableLength[1] = Math.max(toDoObject.user.length, tableLength[1]);
        tableLength[2] = Math.max(toDoObject.date.length, tableLength[2]);
        tableLength[3] = Math.max(toDoObject.comment.length, tableLength[3]);
        tableLength[4] = Math.max(toDoObject.filename.length, tableLength[4]);
    });
    //Обрезаем до максимально разрешенной ширины
    tableLength[1] = tableLength[1] > tableMaxLength.user ? tableMaxLength.user : tableLength[1];
    tableLength[2] = tableLength[2] > tableMaxLength.date ? tableMaxLength.date : tableLength[2];
    tableLength[3] = tableLength[3] > tableMaxLength.comment ? tableMaxLength.comment : tableLength[3];
    tableLength[4] = tableLength[4] > tableMaxLength.filename ? tableMaxLength.filename : tableLength[4];

    let footerLength = displayHeader(tableLength);
    if (toDoStructure.length){
        toDoStructure.forEach(toDoObject => {
            displayLine(tableLength, toDoObject);
        });
        displayFooter(footerLength);
    }
    console.log('\n');
}

function displayHeader(tableLength){
    console.log('\n');
    let header = '  !  |  user' + ' '.repeat(tableLength[1]-4) + '  |  date' + ' '.repeat(tableLength[2]-4) + '  |  comment' + ' '.repeat(tableLength[3]-7) + '  |  filename' + ' '.repeat(tableLength[4]-8) + '  ';
    console.log(header);
    console.log('-'.repeat(header.length))
    return header.length;
}

function displayLine(tableLength, toDoObject){
    let ellipsis = '...';
    let toDoValues = Object.values(toDoObject);
    let line = toDoValues[0] === 0 ? '     ' : '  !  ';
    for(let i = 1; i < 5; i++){
        if(toDoValues[i].length > tableLength[i]){
            line += '|  ' + toDoValues[i].slice(0, tableLength[i] - ellipsis.length) + ellipsis + '  ';
        }else{
            line += '|  ' + toDoValues[i] + ' '.repeat(tableLength[i] - toDoValues[i].length) + '  ';
        }
    }
    console.log(line);
}

function displayFooter(footerLength){
  console.log('-'.repeat(footerLength));
}
