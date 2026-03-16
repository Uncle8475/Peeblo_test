const CHUNK_SIZE = 250; //500
const OVERLAP = 50; //60

const chunkText = (text) => {
  const words = text.split(/\s+/);
  const chunks = [];

  for (let i = 0; i < words.length; i += CHUNK_SIZE - OVERLAP) {
    const chunk = words.slice(i, i + CHUNK_SIZE).join(" ");
    chunks.push(chunk);
  }

  return chunks;
};
export default chunkText;
