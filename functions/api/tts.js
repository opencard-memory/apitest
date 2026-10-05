export async function onRequestPost(context) {

    try {

        const request = context.request;

        // Cloudflare 환경변수
        const apiKey = context.env.FISH_API_KEY;

        if (!apiKey) {
            return new Response(
                JSON.stringify({
                    error: "FISH_API_KEY 환경변수가 설정되지 않았습니다."
                }),
                {
                    status: 500,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        const body = await request.json();

        const text = body.text;
        const referenceId = body.reference_id;

        if (!text || !text.trim()) {
            return new Response(
                JSON.stringify({
                    error: "텍스트가 없습니다."
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        if (!referenceId) {
            return new Response(
                JSON.stringify({
                    error: "reference_id가 없습니다."
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        // Fish Audio API 호출
        const fishResponse = await fetch(
            "https://api.fish.audio/v1/tts",
            {
                method: "POST",

                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                    "model": "s2.1-pro-free"
                },

                body: JSON.stringify({
                    text: text,
                    reference_id: referenceId,
                    format: "mp3"
                })
            }
        );

        // Fish Audio에서 에러가 발생한 경우
        if (!fishResponse.ok) {

            const errorText =
                await fishResponse.text();

            console.error(
                "Fish Audio Error:",
                fishResponse.status,
                errorText
            );

            return new Response(
                JSON.stringify({
                    error: `Fish Audio API 오류 (${fishResponse.status})`,
                    details: errorText
                }),
                {
                    status: fishResponse.status,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        // MP3 바이너리 가져오기
        const audioData =
            await fishResponse.arrayBuffer();

        // 브라우저로 MP3 반환
        return new Response(audioData, {

            status: 200,

            headers: {
                "Content-Type": "audio/mpeg",

                "Cache-Control": "no-store"
            }
        });

    } catch (error) {

        console.error("TTS Function Error:", error);

        return new Response(
            JSON.stringify({
                error: "TTS 서버 처리 중 오류가 발생했습니다.",
                details: error.message
            }),
            {
                status: 500,

                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
    }
}
