import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).lean().exec();
  }

  async findByLogin(login: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ login }).lean().exec();
  }

  async create(userData: Partial<User>): Promise<UserDocument> {
    const createdUser = new this.userModel(userData);
    return createdUser.save();
  }

  async updateProfile(
    id: string,
    currentPassword: string,
    updateData: Partial<User>,
  ): Promise<UserDocument> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Користувача не знайдено');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new ForbiddenException('Невірний поточний пароль');
    }

    if (Object.keys(updateData).length === 0) {
      return (await this.userModel.findById(id).lean().exec()) as UserDocument;
    }

    const updatedUser = await this.update(id, updateData);

    if (!updatedUser) {
      throw new NotFoundException('Користувача не знайдено під час оновлення');
    }

    return updatedUser as UserDocument;
  }

  async update(
    id: string,
    updateData: Partial<User>,
  ): Promise<UserDocument | null> {
    if (updateData.login) {
      const existingUser = await this.userModel.findOne({
        login: updateData.login,
        _id: { $ne: id }
      }).lean().exec();

      if (existingUser) {
        throw new ConflictException('Користувач з таким логіном вже існує');
      }
    }

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
      updateData.refreshTokens = [];
    }

    return this.userModel
      .findByIdAndUpdate(id, updateData, { returnDocument: 'after' })
      .lean()
      .exec() as Promise<UserDocument | null>;
  }

  async delete(id: string): Promise<UserDocument> {
    const deletedUser = await this.userModel.findByIdAndDelete(id).lean().exec();

    if (!deletedUser) {
      throw new NotFoundException('Користувача не знайдено');
    }

    return deletedUser as UserDocument;
  }
}
