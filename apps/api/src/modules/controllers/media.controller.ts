import { Body, Controller, Post } from "@nestjs/common";

@Controller("media")
export class MediaController {
  @Post("presign")
  createPresignedUpload(@Body() body: { ownerType: "business" | "review"; ownerId: string; fileName: string }) {
    return {
      data: {
        uploadUrl: "https://r2.example.invalid/demo-upload-url",
        storageKey: `${body.ownerType}/${body.ownerId}/${body.fileName}`,
        moderationStatus: "pending"
      }
    };
  }
}
