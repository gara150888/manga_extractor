import fs from "fs";

const text = fs.readFileSync("./script.txt", "utf-8");

const result = text.split("\n").filter(line => line.trim() !== "");

const splitArray: string[] = [];
for (let i = 0; i < result.length; i += 5) {
  splitArray.push(result.slice(i, i + 5).replaceAll("\r", "").join(""));
}

console.log(splitArray);
