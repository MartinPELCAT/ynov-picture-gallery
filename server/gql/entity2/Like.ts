import { Entity, ManyToOne } from "typeorm";
import { Lazy } from "../helpers";
import { ReactionEntity, User } from ".";

@Entity()
export class Like {
  @ManyToOne(() => ReactionEntity, { lazy: true, primary: true })
  entity!: Lazy<ReactionEntity>;

  @ManyToOne(() => User, { lazy: true, primary: true })
  user!: Lazy<User>;
}
