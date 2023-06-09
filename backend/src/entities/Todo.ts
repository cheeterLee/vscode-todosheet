import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm"
import { User } from './User'

@Entity()
export class Todo extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column("text")
    text: string

    @Column("boolean", { default: false })
    completed: boolean

    @Column()
    createrId: number

    @ManyToOne(() => User, user => user.todos)
    @JoinColumn({ name: "creatorId" })
    creator: Promise<User>
}