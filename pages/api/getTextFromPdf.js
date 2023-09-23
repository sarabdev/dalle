import fs from 'fs';
import multer from 'multer';
import pdf from 'pdf-parse';

const upload = multer({ storage: multer.memoryStorage() });

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  upload.single('file')(req, {}, async (err) => {
    if (err) {
      console.log('error');
      return res.status(500).json({ error: true });
    }

    try {
      console.log(req.file);
      const converted = await pdf(req.file.buffer);
      // do something with the data
      console.log(converted.text);
      res.status(200).json({ error: false, text: converted.text.trim() });
    } catch (error) {
      console.error(`Error reading file from disk: ${error}`);
      return res.status(500).json({ error: true });
    }
  });
}
