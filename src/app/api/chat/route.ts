import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message, conversationId, model } = await request.json();

    if (!message || !conversationId) {
      return NextResponse.json(
        { error: 'Message and conversationId are required' },
        { status: 400 }
      );
    }

    // استخدام Hugging Face Router API مع Kimi-K2-Thinking أو Kimi-K2-Instruct
    const selectedModel = model || 'moonshotai/Kimi-K2-Thinking';

    const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HF_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: 'أنت مساعد AI ذكي ومفيد. أجب باللغة العربية بشكل واضح ومفيد.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
        stream: true
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Hugging Face API Error:', errorData);

      return NextResponse.json(
        {
          error: 'Hugging Face API failed',
          details: `Model: ${selectedModel}, Status: ${response.status}`
        },
        { status: 500 }
      );
    }

    // عندما يكون stream: true، نحصل على Server-Sent Events (SSE)
    const responseText = await response.text();
    console.log('Raw Hugging Face Response:', responseText);

    // استخراج البيانات من SSE format
    let finalContent = '';

    // تقسيم الـ response حسب الأسطر
    const lines = responseText.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const jsonData = JSON.parse(line.substring(6)); // إزالة "data: "
          console.log('Parsed SSE data:', jsonData);

          if (jsonData.choices && jsonData.choices[0]) {
            const choice = jsonData.choices[0];

            // جمع أجزاء الرد المختلفة
            if (choice.delta && choice.delta.content) {
              finalContent += choice.delta.content;
            }

            // إذا انتهى التدفق
            if (choice.finish_reason) {
              console.log('Stream finished with reason:', choice.finish_reason);
              break;
            }
          }
        } catch (parseError) {
          console.log('Failed to parse SSE line:', line, parseError);
          // قد تحتوي بعض الأسطر على بيانات أخرى مثل [DONE]
          if (line.includes('[DONE]')) {
            console.log('Stream completed');
            break;
          }
        }
      }
    }

    const aiResponse = finalContent || 'عذراً، لم أتمكن من توليد رد مناسب.';

    return NextResponse.json({
      response: aiResponse,
      conversationId,
      model: selectedModel
    });

  } catch (error) {
    console.error('API Error:', error);

    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
