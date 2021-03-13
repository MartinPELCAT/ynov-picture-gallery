import { Destination, Album, User } from ".";
import { Field, ObjectType } from "type-graphql";
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from "typeorm";
import { Lazy } from "../helpers";
import { ReactionableEntity } from "./ReactionableEntity";

@ObjectType()
@Entity()
export class Travel {
  @PrimaryColumn("uuid")
  @ManyToOne(() => ReactionableEntity, { lazy: true })
  @JoinColumn({ name: "entity" })
  @Field(() => ReactionableEntity)
  entity!: Lazy<ReactionableEntity>;

  @Column()
  @Field()
  name!: string;

  @Column({ nullable: true })
  @Field({ nullable: true })
  description!: string;

  @OneToMany(() => Destination, (destination) => destination.travel, {
    lazy: true,
  })
  @Field(() => [Destination])
  destinations!: Lazy<Destination[]>;

  @OneToMany(() => Album, (album) => album.travel, { lazy: true })
  @Field(() => [Album])
  albums!: Lazy<Album[]>;

  @ManyToOne(() => User, (user) => user.travels, {
    lazy: true,
  })
  @Field(() => User)
  user!: Lazy<User>;
}
