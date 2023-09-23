const { Configuration, OpenAIApi } = require('openai');
const configuration = new Configuration({
  apiKey: process.env.IMAGE_API_KEY,
});

const openai = new OpenAIApi(configuration);

export default async function handler(req, res) {
  //   const { prompt } = req.body;
  console.log(req.body);
  try {
    const response = await openai.createImage({
      prompt: req.body,
      n: 1,
      size: '1024x1024',
    });
    console.log(response.data.data[0].url);
    res.json({ imgurl: response.data.data[0].url });
  } catch (e) {
    console.error('Error creating image:', error);
    res
      .status(error.response.status || 500)
      .send(error.response.data || 'Error creating image');
  }
}
