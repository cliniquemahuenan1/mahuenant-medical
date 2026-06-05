exports.handler = async (event) => {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.VITE_ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: event.body
  });
  const data = await response.json();
  return {
    statusCode: response.status,
    body: JSON.stringify(data)
  };
};