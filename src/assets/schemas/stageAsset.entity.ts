// stage-asset.entity.ts
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('stageAssets') // Name of the staging table
export class StageAsset {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  eventId: string; // Required

  @Column({ type: 'timestamp', nullable: true })
  egressEventTime: Date; // Optional

  @Column()
  deviceId: string; // Required

  @Column({ nullable: true })
  tagNumber: string; // Required

  @Column({ nullable: true })
  description: string; // Required

  @Column({ nullable: true })
  manufacturer: string; // Required

  @Column({ nullable: true })
  modelNumber: string; // Required

  @Column({ type: 'timestamp', nullable: true })
  lastSeenTime: Date; // Required

  @Column({ nullable: true })
  lastLocation: string; // Required

  @Column({ nullable: true })
  previousEgressLocation: string; // Optional

  @Column({ nullable: true })
  status: string; // Required

  @Column({ type: 'timestamp', nullable: true })
  returnedAt: Date; // Optional

  @Column({ type: 'boolean', nullable: true })
  unableToLocate: boolean; // Required

  @Column({ nullable: true })
  zoneId: string; // Required

  @Column({ nullable: true })
  zoneCategory: string; // Optional

  @Column({ nullable: true })
  floor: string; // Optional

  @Column({ nullable: true })
  department: string; // Optional

  @Column({ nullable: true })
  organizationId: string; // Optional
}
