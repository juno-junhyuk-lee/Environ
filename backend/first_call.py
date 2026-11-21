from google import genai 

client = genai.Client()

interaction = client.interactions.create (
    model='gemini-3.1-flash-lite',
    input="Explain how pollution affects bodies of water and forests"
)
print(interaction.output_text)