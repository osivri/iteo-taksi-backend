import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserDocumentsService } from './user-documents.service';
import { CreateUserDocumentDto } from './dto/user-document.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

@ApiTags('User Documents')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('user-documents')
export class UserDocumentsController {
  constructor(private readonly userDocumentsService: UserDocumentsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Kendi belgelerim' })
  async listMine(@CurrentUser() user: AuthUser) {
    const data = await this.userDocumentsService.listMine(user);
    return { success: true, data };
  }

  @Post()
  @ApiOperation({ summary: 'Doğrulama belgesi kaydet' })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateUserDocumentDto) {
    const data = await this.userDocumentsService.create(user, dto);
    return { success: true, data, message: 'Belge kaydedildi' };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Belge detayı' })
  async getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const data = await this.userDocumentsService.getById(user, id);
    return { success: true, data };
  }
}
