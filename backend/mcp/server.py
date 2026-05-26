from __future__ import annotations

import asyncio
from typing import Optional

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import TextContent, Tool

from db.postgres import AsyncSessionLocal
from db.milvus_client import get_milvus
from agents.orchestrator import handle_oracle, handle_journal, handle_person_brief

app = Server("soulscribe")


@app.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="add_entry",
            description="Add a new diary entry to SOULSCRIBE",
            inputSchema={
                "type": "object",
                "properties": {"content": {"type": "string"}},
                "required": ["content"],
            },
        ),
        Tool(
            name="ask_oracle",
            description="Ask SOULSCRIBE a question about your life, history, or for decision support",
            inputSchema={
                "type": "object",
                "properties": {"question": {"type": "string"}},
                "required": ["question"],
            },
        ),
        Tool(
            name="get_person_brief",
            description="Get a summary of everything SOULSCRIBE knows about a person",
            inputSchema={
                "type": "object",
                "properties": {"name": {"type": "string"}},
                "required": ["name"],
            },
        ),
        Tool(
            name="search_entries",
            description="Search diary entries semantically",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {"type": "string"},
                    "limit": {"type": "integer", "default": 5},
                },
                "required": ["query"],
            },
        ),
    ]


@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    async with AsyncSessionLocal() as db:
        milvus = get_milvus()

        if name == "add_entry":
            result = await handle_journal(arguments["content"], "default", db, milvus)
            return [TextContent(type="text", text=f"Entry saved: {result['entry_type']} | {result.get('key_insight', '')}")]

        elif name == "ask_oracle":
            response = await handle_oracle(arguments["question"], "default", db, milvus)
            conf = response.confidence.overall_confidence
            return [TextContent(type="text", text=f"[Confidence: {int(conf*100)}%]\n\n{response.answer}")]

        elif name == "get_person_brief":
            result = await handle_person_brief(arguments["name"], "default", db, milvus)
            brief = result.get("brief", {})
            text = f"**{brief.get('name', arguments['name'])}**\n{brief.get('relationship_summary', '')}\n\nKey facts:\n"
            for fact in brief.get("key_facts", []):
                text += f"• {fact}\n"
            return [TextContent(type="text", text=text)]

        elif name == "search_entries":
            from wisdom.retriever import WisdomRetriever
            retriever = WisdomRetriever(milvus, db)
            entries = await retriever.retrieve_personal(
                arguments["query"], "default", top_k=arguments.get("limit", 5)
            )
            lines = [f"[{e.created_at.strftime('%Y-%m-%d')}] {e.content[:200]}" for e in entries]
            return [TextContent(type="text", text="\n\n".join(lines) or "No matching entries found.")]

    return [TextContent(type="text", text="Unknown tool")]


async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())


if __name__ == "__main__":
    asyncio.run(main())
