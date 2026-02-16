import os
import nest_asyncio
from llama_parse import LlamaParse
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()
nest_asyncio.apply()

class PDFParser:
    def __init__(self):
        self.llama_cloud_key = os.getenv("LLAMA_CLOUD_API_KEY")
        if not self.llama_cloud_key:
            print("Warning: LLAMA_CLOUD_API_KEY not found in environment variables.")

        self.parser = LlamaParse(
            result_type="markdown",  # "markdown" and "text" are available
            verbose=True,
            language="en",
        )

    async def parse_pdf(self, file_path: str) -> str:
        """
        Parse a PDF file into Markdown using LlamaParse.
        """
        if not os.path.exists(file_path):
            return f"Error: File {file_path} not found."

        try:
            documents = await self.parser.aload_data(file_path)
            # Combine all pages into one markdown string
            full_text = "\n\n".join([doc.text for doc in documents])
            return full_text
        except Exception as e:
            return f"Error parsing PDF: {str(e)}"

# Example usage
if __name__ == "__main__":
    import asyncio
    
    async def main():
        parser = PDFParser()
        # Replace with a valid path to test
        # print(await parser.parse_pdf("path/to/report.pdf"))
        pass

    asyncio.run(main())
