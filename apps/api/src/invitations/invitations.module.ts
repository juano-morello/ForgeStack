/**
 * Invitations Module
 * Provides invitation management functionality
 */

import { Module } from '@nestjs/common';
import { InvitationsController, PublicInvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { InvitationsRepository } from './invitations.repository';
import { OrganizationsModule } from '../organizations/organizations.module';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [OrganizationsModule, ActivitiesModule],
  controllers: [InvitationsController, PublicInvitationsController],
  providers: [InvitationsRepository, InvitationsService],
  exports: [InvitationsService, InvitationsRepository],
})
export class InvitationsModule {}

