// Go to your terminal and install multer and fs
// npm install multer fs
import fs from 'fs';
import multer from 'multer';
import pdf from 'pdf-parse';

const upload = multer({ dest: 'uploads/' });

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
      const data = fs.readFileSync(req.file.path);
      console.log(data);
      const converted = await pdf(data);
      // do something with the data
      console.log(converted.text);
      res.status(200).json({ error: false, text: converted.text.trim() });

      // delete the file after reading
      fs.unlinkSync(req.file.path);
    } catch (error) {
      console.error(`Error reading file from disk: ${error}`);
      return res.status(500).json({ error: true });
    }
  });
}
