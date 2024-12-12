const fs = require('fs');
const path = require('path');

// Папката с игрите
const gamesDir = path.join(__dirname, 'games');

// Път до изходната папка
const srcDir = path.join(__dirname, 'gameModules');

// Проверка и създаване на папката `src`, ако не съществува
if (!fs.existsSync(srcDir)) {
    fs.mkdirSync(srcDir, { recursive: true }); // Създава папката, ако я няма
    console.log(`Папката ${srcDir} беше създадена.`);
}

// Генериране на обект с наличните игри
function generateGamesObject() {
    const games = fs.readdirSync(gamesDir).filter(file => {
        const filePath = path.join(gamesDir, file);
        return fs.statSync(filePath).isDirectory(); // Вземаме само директории
    });

    let cases = {};
    games.forEach(game => {
        cases[game] = {
            script: `./games/${game}/${game}.js`,
            style: `games/${game}/${game}.css`
        };
    });

    return cases;
}

// Записване на резултата в JavaScript файл
const outputPath = path.join(srcDir, 'generatedGames.js'); // Изходният файл в папка src
const gamesObject = generateGamesObject();
const fileContent = `
export const games = ${JSON.stringify(gamesObject, null, 4)};
`;

fs.writeFileSync(outputPath, fileContent, 'utf8');
console.log("Файлът generatedGames.js е обновен успешно!");
