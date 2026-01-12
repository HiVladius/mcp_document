## Quick Start Guide

### Install Dependencies
```bash
npm install @modelcontextprotocol/sdk axios
```

### Compile TypeScript
Ensure your `tsconfig.json` includes `"outDir": "dist"`, then run:
```bash
npx tsc
```

### Configure Claude Desktop
Add the following to your MCP client configuration file:
```json
{
    "structurizr": {
        "command": "node",
        "args": ["/your/path/dist/index.js"],
        "env": {
            "STRUCTURIZR_WORKSPACE_ID": "your_id",
            "STRUCTURIZR_API_KEY": "your_key",
            "STRUCTURIZR_API_SECRET": "your_secret"
        }
    }
}
```

## Why This Approach?

- **Easy Debugging**: Full authentication flow is visible and traceable
- **No Abstractions**: Understand exactly how MCP SDK maps requests to Structurizr API
- **Portability**: Single file you can copy across any TypeScript environment

## Next Steps

Consider adding schema validation before sending requests to Structurizr to prevent schema errors.