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
