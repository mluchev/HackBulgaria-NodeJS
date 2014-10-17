var fs = require('fs'),
    os = require('os'),
    http = require('http'),
    https = require('https'),
    ArgumentParser = require('argparse').ArgumentParser,
    fileArg = process.argv[2],
    isRemoteFile = (fileArg.indexOf('http://') !== -1 || fileArg.indexOf('https://') !== -1),
    inputFile,
    fileUrlParts,
    explicitType = getExplicitTypeArg(ArgumentParser);

if(isRemoteFile) {
    fileUrlParts = fileArg.split('/');
    inputFile = fileUrlParts[fileUrlParts.length -1],
    protocolToBeUsed = (fileArg.indexOf('http://') !== -1) ? http : https;

    protocolToBeUsed.get(fileArg, function(res) {
        res.on('data', function(fileData) {
            var receivedFileEOL = (fileData.toString().indexOf('\r\n') === -1) ? '\n' : '\r\n'

            if(fileData) {
                convert(inputFile, fileData.toString(), receivedFileEOL, explicitType);
            }
        });

        res.on('error', function(e) {
            console.log("Got error: " + e.message);
        });

    })
} else {
    fs.readFile(fileArg, function(err, fileData) {
        if (err) {
            console.log(err);
        } else {
            convert(fileArg, fileData.toString(), os.EOL, explicitType);
        }
    });
}


function convert(inputFile, fileData, EOL, explicitType) {
    var fileName = inputFile.split('.')[0],
        fileType = inputFile.split('.')[1] || explicitType,
        resultFileName,
        resultFileData;


    if(fileType === 'ini' || fileType === undefined) {
        resultFileData = convertINItoJSON(fileData, EOL);
        resultFileName = fileName + '.json';
    } else if(fileType === 'json') {
        resultFileData = convertJSONtoINI(fileData, EOL);
        resultFileName = fileName +'.ini';
    } else {
        console.log("File type not supported.");
        return;
    }


    fs.writeFile(resultFileName, resultFileData, function (err) {
        if (err) {
            console.log(err);
        }
        console.log(resultFileName + ' is saved.');
    });
}

function convertINItoJSON(iniData, EOL) {
    var jsonObject = {},
        currJsonKey,
        sections = iniData.split(EOL);

    sections.forEach(function(item) {
        var propertyParts;

        if(item.charAt(0) === '[' && item.charAt(item.length - 1) === ']') {
            currJsonKey = item.replace('[', '').replace(']', '');
            jsonObject[currJsonKey.trim()] = {};
        } else {
            if(item && item.charAt(0) !== ';') {
                propertyParts = item.split('=');
                jsonObject[currJsonKey][propertyParts[0].trim()] = propertyParts[1].trim();
            }
        }
    });

    return JSON.stringify(jsonObject, null, 4);
}

function convertJSONtoINI(jsonData, EOL) {
    var iniString = '',
        jsonObject = JSON.parse(jsonData),
        sections = Object.keys(jsonObject);

    sections.forEach(function(sectionName) {
        var propertyNames;

        iniString += '[' + sectionName + ']' + EOL;
        propertyNames = Object.keys(jsonObject[sectionName]);

        propertyNames.forEach(function(propertyName) {
            iniString += propertyName + '=' + jsonObject[sectionName][propertyName] + EOL;
        });
    });

    return iniString;
}

function getExplicitTypeArg(ArgumentParser) {
    var parser = new ArgumentParser({}),
        explicitType;

    parser.addArgument(['--type']);
    args = parser.parseKnownArgs();
    if(args[0].type) {
        console.log();
        explicitType = args[0].type;
    }

    return explicitType;
}