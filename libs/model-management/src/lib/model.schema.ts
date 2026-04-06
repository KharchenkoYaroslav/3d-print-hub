import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ModelDocument = Model & Document;

@Schema({ _id: false })
export class FileItem {
  @Prop({ required: true })
  originalName!: string;

  @Prop({ required: true })
  filename!: string;

  @Prop({ required: true })
  order!: number;
}

@Schema({ _id: false })
export class FilesObject {
  @Prop({ type: [FileItem], default: [] })
  gallery!: FileItem[];

  @Prop({ type: [FileItem], default: [] })
  models!: FileItem[];
}

@Schema({ timestamps: true })
export class Model {
  @Prop({ required: true })
  title!: string;

  @Prop()
  description!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  authorId!: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Category' }], default: [] })
  categoryIds!: Types.ObjectId[];

  @Prop()
  size!: string;

  @Prop()
  recommendedMaterial!: string;

  @Prop()
  estimatedPrintTime!: number;

  @Prop()
  estimatedVolume!: number;

  @Prop({ default: false })
  allowCommercialUse!: boolean;

  @Prop({ type: FilesObject, default: () => ({}) })
  files!: FilesObject;
}

export const ModelSchema = SchemaFactory.createForClass(Model);
