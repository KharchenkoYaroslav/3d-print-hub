import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PhysicalFileDocument = PhysicalFile & Document;

@Schema({ collection: 'physical_files', timestamps: true })
export class PhysicalFile {
  @Prop({ required: true, unique: true })
  filename!: string;

  @Prop({ required: true, index: true })
  etag!: string;

  @Prop({ default: 1 }) 
  ref_count!: number;
}

export const PhysicalFileSchema = SchemaFactory.createForClass(PhysicalFile);
