class HuffmanNode {
    constructor(char, freq, left = null, right = null) {
        this.char = char;
        this.freq = freq;
        this.left = left;
        this.right = right;
    }
}

function countFrequencies(str) {
    const freq = new Map();
    for (let ch of str) {
        freq.set(ch, (freq.get(ch) || 0) + 1);
    }
    return freq;
}

function buildHuffmanTree(freqMap) {
    let nodes = [];
    for (let [char, freq] of freqMap) {
        nodes.push(new HuffmanNode(char, freq));
    }

    if (nodes.length === 1) {
        return nodes[0];
    }

    while (nodes.length > 1) {
        nodes.sort((a, b) => a.freq - b.freq);
        const left = nodes.shift();
        const right = nodes.shift();
        const parent = new HuffmanNode(null, left.freq + right.freq, left, right);
        nodes.push(parent);
    }

    return nodes[0];
}

function generateCodes(node, code = "", codeMap = new Map()) {
    if (!node) return codeMap;

    if (node.char !== null) {
        codeMap.set(node.char, code === "" ? "0" : code);
        return codeMap;
    }

    generateCodes(node.left, code + "0", codeMap);
    generateCodes(node.right, code + "1", codeMap);

    return codeMap;
}

function serializeTree(node) {
    if (!node) return "";
    if (node.char !== null) {
        return `0${node.char};`;
    } else {
        return `1${serializeTree(node.left)}${serializeTree(node.right)}`;
    }
}

function deserializeTree(data, index = { pos: 0 }) {
    if (index.pos >= data.length) return null;

    const type = data[index.pos];
    index.pos++;

    if (type === '0') {
        let charStr = "";
        while (index.pos < data.length && data[index.pos] !== ';') {
            charStr += data[index.pos];
            index.pos++;
        }
        index.pos++;
        return new HuffmanNode(charStr, 0);
    } else if (type === '1') {
        const left = deserializeTree(data, index);
        const right = deserializeTree(data, index);
        return new HuffmanNode(null, 0, left, right);
    }

    return null;
}

function getUtf8Bytes(str) {
    return new TextEncoder().encode(str).length;
}

function huffmanEncode(str) {
    if (!str || str.length === 0) {
        return {
            original: str,
            encodedBits: "",
            codes: new Map(),
            root: null,
            treeStructure: "",
            stats: {
                originalBytes: 0,
                bitsBytes: 0,
                treeBytes: 0,
                compressedBytes: 0,
                savingsPercent: 0
            }
        };
    }

    const freqMap = countFrequencies(str);
    const root = buildHuffmanTree(freqMap);
    const codes = generateCodes(root);

    let encodedBits = "";
    for (let ch of str) {
        encodedBits += codes.get(ch);
    }

    const treeStructure = serializeTree(root);

    const originalBytes = getUtf8Bytes(str);
    const bitsBytes = Math.ceil(encodedBits.length / 8);
    const treeBytes = getUtf8Bytes(treeStructure);
    const compressedBytes = bitsBytes + treeBytes;

    let savingsPercent = 0;
    if (originalBytes > 0) {
        savingsPercent = ((originalBytes - compressedBytes) / originalBytes * 100);
        savingsPercent = Math.round(savingsPercent * 10) / 10;
    }

    return {
        original: str,
        encodedBits: encodedBits,
        codes: codes,
        root: root,
        treeStructure: treeStructure,
        stats: {
            originalBytes: originalBytes,
            bitsBytes: bitsBytes,
            treeBytes: treeBytes,
            compressedBytes: compressedBytes,
            savingsPercent: savingsPercent
        }
    };
}

function huffmanDecode(encodedBits, treeRoot, originalBitLength = null) {

    // нет данных
    if (!encodedBits || encodedBits.length === 0) return "";
    if (!treeRoot) return "";

    // Убираем лишние биты после padEnd()
    if (originalBitLength !== null) {
        encodedBits = encodedBits.substring(0, originalBitLength);
    }

    // СПЕЦИАЛЬНЫЙ СЛУЧАЙ:
    // в файле только один уникальный символ
    if (treeRoot.left === null && treeRoot.right === null) {
        return treeRoot.char.repeat(encodedBits.length);
    }

    let result = "";
    let currentNode = treeRoot;

    for (let i = 0; i < encodedBits.length; i++) {

        const bit = encodedBits[i];

        if (bit === '0') {
            currentNode = currentNode.left;
        } else {
            currentNode = currentNode.right;
        }

        // дошли до листа
        if (currentNode.char !== null) {
            result += currentNode.char;
            currentNode = treeRoot;
        }
    }

    return result;
}

function formatCodeTable(codesMap) {
    if (!codesMap || codesMap.size === 0) return "Нет данных";

    let result = "<table style='width:100%; border-collapse: collapse;'>";
    result += "<tr><th style='text-align:left;'>Символ</th><th style='text-align:left;'>Код</th><th style='text-align:right;'>Длина (бит)</th></tr>";

    const sorted = Array.from(codesMap.entries()).sort((a, b) => {
        if (a[1].length !== b[1].length) return a[1].length - b[1].length;
        return a[0].localeCompare(b[0]);
    });

    for (let [char, code] of sorted) {
        let displayChar = char;
        if (char === '\n') displayChar = '\\n';
        else if (char === '\r') displayChar = '\\r';
        else if (char === '\t') displayChar = '\\t';
        else if (char === ' ') displayChar = '[пробел]';

        result += `<tr><td style='font-family:monospace; padding:4px;'>${displayChar}</td>
                   <td style='font-family:monospace; padding:4px;'>${code}</td>
                   <td style='text-align:right; padding:4px;'>${code.length}</td></tr>`;
    }
    result += "</table>";
    return result;
}

window.Huffman = {
    encode: huffmanEncode,
    decode: huffmanDecode,
    deserializeTree: deserializeTree,
    formatCodeTable: formatCodeTable
};