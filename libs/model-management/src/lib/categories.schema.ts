import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CategoriesDocument = Categories & Document;

@Schema()
export class Categories {
  @Prop({ required: true, unique: true })
  title!: string;

  @Prop({ required: true })
  description!: string;
}

export const CategoriesSchema = SchemaFactory.createForClass(Categories);
