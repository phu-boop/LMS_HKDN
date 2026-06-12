# Content Processing Runbook (Video -> HLS)

This guide shows the full flow for creating a new VIDEO content, uploading file to object storage, confirming upload, publishing, processing to HLS, and retrieving stream URL.

## 1) Prerequisites

- API is running on localhost:5294
- Redis is reachable
- ffmpeg is installed on the machine that runs API
- You have a valid access token for tenant STEM user

## 2) Environment Variables

```bash
BASE=http://localhost:5294
TENANT_ID=00000000-0000-0000-0000-000000000002
NODE_ID=8edfa44e-67e5-445d-9439-8495bd04471d
VIDEO_PATH="/Users/phuongvx/Downloads/Intro Main Text.mp4"
TOKEN="PASTE_ACCESS_TOKEN_HERE"
```

## 3) Create New Content (get contentId, uploadUrl, objectKey)

```bash
CREATE_RESP=$(curl --silent --show-error --location "$BASE/api/tenants/$TENANT_ID/contents" \
  --header "Authorization: Bearer $TOKEN" \
  --header "Content-Type: application/json" \
  --data "{
    \"curriculumNodeId\": \"$NODE_ID\",
    \"type\": \"VIDEO\",
    \"title\": \"Intro Main Text\",
    \"description\": \"Intro Main Text\",
    \"fileName\": \"Intro Main Text.mp4\",
    \"sourceUrl\": null,
    \"watermarkEnabled\": true,
    \"isDownloadable\": false,
    \"visibilityFrom\": null,
    \"visibilityTo\": null
  }")

echo "$CREATE_RESP" | jq
CONTENT_ID=$(echo "$CREATE_RESP" | jq -r ".contentId")
UPLOAD_URL=$(echo "$CREATE_RESP" | jq -r ".uploadUrl")
OBJECT_KEY=$(echo "$CREATE_RESP" | jq -r ".objectKey")
```

## 4) Upload File to Presigned URL

```bash
curl --silent --show-error -X PUT "$UPLOAD_URL" \
  --header "Content-Type: video/mp4" \
  --upload-file "$VIDEO_PATH" -i
```

## 5) Confirm Upload

Important:
- Send only one Authorization header
- Request body only needs 4 fields below

```bash
curl --silent --show-error --location "$BASE/api/tenants/$TENANT_ID/contents/$CONTENT_ID/upload" \
  --header "Authorization: Bearer $TOKEN" \
  --header "Content-Type: application/json" \
  --data "{
    \"fileName\": \"Intro Main Text.mp4\",
    \"objectKey\": \"$OBJECT_KEY\",
    \"mimeType\": \"video/mp4\",
    \"fileSizeBytes\": 420000
  }" | jq
```

## 6) Publish Content

```bash
curl --silent --show-error --location "$BASE/api/tenants/$TENANT_ID/contents/$CONTENT_ID/status" \
  --request PATCH \
  --header "Authorization: Bearer $TOKEN" \
  --header "Content-Type: application/json" \
  --data '{"publishStatus":"PUBLISHED"}' | jq
```

## 7) Poll Processing Status

```bash
while true; do
  RESP=$(curl --silent --show-error --location "$BASE/api/tenants/$TENANT_ID/contents/$CONTENT_ID/processing-status" \
    --header "Authorization: Bearer $TOKEN")

  STATUS=$(echo "$RESP" | jq -r ".status")
  echo "$RESP" | jq

  if [ "$STATUS" = "READY" ]; then
    break
  fi

  if [ "$STATUS" = "FAILED" ]; then
    break
  fi

  sleep 3
done
```

## 8) Reprocess if FAILED

```bash
curl --silent --show-error --location "$BASE/api/tenants/$TENANT_ID/contents/$CONTENT_ID/reprocess" \
  --request POST \
  --header "Authorization: Bearer $TOKEN" | jq
```

## 9) Get Stream URL for Client

```bash
curl --silent --show-error --location "$BASE/api/client/contents/$CONTENT_ID/stream-url" \
  --header "Authorization: Bearer $TOKEN" | jq
```

## 10) Verify Queue and Worker

Pending jobs in Redis list:

```bash
redis-cli -h 103.159.51.19 -p 6379 -a "lms_dev_redis" LLEN lms:media:video:transcode
```

See pending payloads:

```bash
redis-cli -h 103.159.51.19 -p 6379 -a "lms_dev_redis" LRANGE lms:media:video:transcode 0 10
```

Source of truth is API processing status.
Success criteria:
- status = READY
- stream-url returns a signed HLS URL

## 11) Import cURL Directly into Postman

If you want to import a single request from cURL (without collection file):

1. Open Postman
2. Click Import
3. Choose Raw text
4. Paste cURL
5. Click Import

Example cURL for stream-url:

```bash
curl --location 'http://localhost:5294/api/client/contents/79aeb952-0812-42cb-bd4d-225c1fb2b74e/stream-url' \
--header 'Authorization: Bearer PASTE_ACCESS_TOKEN_HERE'
```

Note:
- Use a fresh access token (avoid expired token).
- Only send one Authorization header.
