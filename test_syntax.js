import { readFileSync } from 'fs';
const code = readFileSync('GameBoard.jsx', 'utf8');

// very basic sanity checks to make sure we didn't wipe the file
if (code.includes('export default function GameBoard()') && code.includes('const [summonCost, setSummonCost] = useState(50);') && code.includes('<div className="floating-damage"')) {
    console.log("Syntax smoke test passed.");
} else {
    console.log("Syntax smoke test failed. Missing expected strings.");
    process.exit(1);
}
