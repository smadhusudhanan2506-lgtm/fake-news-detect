import axios from 'axios';

async function testPollinations() {
  try {
    const res = await axios.post('https://text.pollinations.ai/', {
      messages: [
        { role: 'system', content: 'You are FactCheck AI Assistant.' },
        { role: 'user', content: 'How are you?' }
      ],
      model: 'openai',
      jsonMode: false
    }, { timeout: 10000 });
    console.log('Pollinations AI response:', res.data);
  } catch (err: any) {
    console.log('Pollinations error:', err.message);
  }
}

testPollinations();
