# MUX Video

Video content element backed by [Mux](https://mux.com) for streaming, signed
playback, captions, and transcripts.

**Type:** `MUX_VIDEO`

## Data

| Field | Type | Description |
|-------|------|-------------|
| `fileName` | `string?` | Original uploaded file name |
| `playbackId` | `string?` | Mux playback ID used by the player |
| `assetId` | `string?` | Mux asset ID (used for asset removal) |
| `transcript` | `string?` | Public URL of the transcript file |
| `captions` | `string?` | Public URL of the captions (VTT) file |

## Edit

- Top toolbar: upload a video file (`.mp4`, `.mov`, `.avi`, `.mkv`) — uploads
  to storage, then ingests via Mux URL ingest or chunked direct upload
  depending on storage reachability
- Live progress for upload and processing, with cancel support
- Inline preview via `mux-player` once the asset is ready
- Side toolbar: optional transcript file (`.doc`, `.docx`, `.pdf`, `.txt`)
- Side toolbar: optional captions file (`.vtt`, `.srt` — SRT is converted to
  VTT automatically)

## Display

- Streams the video through `mux-player` with signed playback and thumbnail
  tokens
- Renders the captions track when provided
- "Transcript" button links to the uploaded transcript
- Resumes playback from the last reported position via `userState`

## Development

```sh
pnpm dev     # Preview :8080 | Edit :8010 | Display :8020 | Server :8030
pnpm build
pnpm lint
pnpm test
```

## Run with Docker

```sh
docker compose up
```
