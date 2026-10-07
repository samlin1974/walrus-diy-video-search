# WALRUS DIY Video Search

Static video timeline search demo. The site entry point is `site/index.html`.
The supplied timeline descriptions are demo data, not an automatically generated
or independently verified transcript.

## Local Preview

Run `python -m http.server 8767 --bind 127.0.0.1 --directory site` and open
http://127.0.0.1:8767. Serve over HTTP instead of opening the HTML as a file.

## GitHub Pages

Push this directory to the repository's `main` branch. In Settings > Pages,
select GitHub Actions as the publishing source. The included workflow validates
the JavaScript behavior and deploys only the `site` directory.

## Validation

Run `node checks.cjs`. Checks cover search, filters, cross-video selection,
timestamp links, player errors, retry, and safe rendering of search input.
These checks simulate the YouTube API; actual video playback must be checked
in a browser after deployment.

YouTube can restrict embedding or video availability. The app handles player
errors and provides timestamp links to YouTube; it cannot override video-owner
restrictions. GitHub Pages does not guarantee that every video will embed.

## Knowledge Base Export

Run `node export-knowledge.cjs` to export the 36 timeline segments to Markdown,
JSON, JSONL, and CSV in `knowledge-base`. Each segment includes its own YouTube
timestamp URL. See the import and answer configuration guide in that directory.
The export preserves the HTML's preset data; it does not verify the transcript.

## Maintenance Assistant

The demo integrates the supplied Dify public chatbot embed configuration.
HTTP preview pages load the chat bubble from the internal Dify service.
HTTPS GitHub Pages uses an "Open maintenance assistant" link in a new tab,
because browsers block HTTP scripts on HTTPS pages. The service at
`http://10.1.66.60:3001` requires access to that network.
An HTTPS Dify endpoint is required to embed the bubble on the public site.
The knowledge-base files must still be imported into Dify and attached to
the chatbot app; adding the embed does not configure its retrieval pipeline.
