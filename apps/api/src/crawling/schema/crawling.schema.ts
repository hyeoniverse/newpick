import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'CrawledNews' })
export class CrawledNews extends Document {
  @Prop({ type: String })
  id: string;

  @Prop({ type: String, required: true })
  regionCode: string;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true, unique: true })
  link: string;

  @Prop({ type: String, required: true })
  source: string;

  @Prop({ type: [String], required: true })
  category: string[];

  @Prop({ type: String, required: true })
  publishedAt: string;

  /** TTL 인덱스: 저장 후 30일이 지나면 MongoDB가 자동으로 삭제합니다. */
  @Prop({ type: Date, required: true, default: Date.now, expires: '30d' })
  createdAt: Date;

  @Prop({ type: [String], required: false })
  images: string[];

  @Prop({ type: String, required: true })
  content: string;

  /**
   * 문장 임베딩 (bge-m3). 뉴스레터를 쓸 때 같은 사건 묶기로 계산한 것을 남겨, 추천 기사에서 다시 쓴다.
   * 무거워 기본 조회에서는 뺀다
   */
  @Prop({ type: [Number], required: false, select: false })
  embedding?: number[];
}

export const CrawledNewsSchema = SchemaFactory.createForClass(CrawledNews);
