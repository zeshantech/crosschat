export class SendMessageDto {
  content!: string;
  idempotencyKey?: string;
  isInbound?: boolean;
}
