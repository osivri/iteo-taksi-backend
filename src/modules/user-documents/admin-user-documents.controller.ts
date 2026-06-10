import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserDocumentsService } from './user-documents.service';
import { ReviewUserDocumentDto } from './dto/user-document.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@ApiTags('Admin User Documents')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/user-documents')
export class AdminUserDocumentsController {
  constructor(private readonly userDocumentsService: UserDocumentsService) {}

  @Get('pending')
  @ApiOperation({ summary: 'Bekleyen belgeler' })
  async listPending(@Query() query: PaginationQueryDto) {
    const result = await this.userDocumentsService.adminListPending(query.page, query.limit);
    return { success: true, ...result };
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Kullanıcı belgeleri' })
  async listByUser(@Param('userId') userId: string) {
    const data = await this.userDocumentsService.adminListByUser(userId);
    return { success: true, data };
  }

  @Patch(':id/review')
  @ApiOperation({ summary: 'Belge incele / onayla / reddet' })
  async review(@Param('id') id: string, @Body() dto: ReviewUserDocumentDto) {
    const data = await this.userDocumentsService.adminReview(id, dto);
    return { success: true, data, message: 'Belge güncellendi' };
  }
}
