import { Field, Int, ObjectType } from "type-graphql";
import { Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Lazy } from "../helpers";
import { Comment } from "./Comment";
import { Like } from "./Like";

@Entity()
@ObjectType()
export class ReactionableEntity {
  @PrimaryGeneratedColumn("uuid")
  @Field()
  uuid!: string;

  @OneToMany(() => Like, (like) => like.entity_uuid, { lazy: true })
  @Field(() => [Like])
  likes!: Lazy<Like[]>;

  @OneToMany(() => Comment, (cmt) => cmt.entity_uuid, { lazy: true })
  @Field(() => [Comment])
  comments!: Lazy<Comment[]>;

  @Field(() => Int)
  likesCount!: number;

  @Field(() => Int)
  commentCount!: number;
}