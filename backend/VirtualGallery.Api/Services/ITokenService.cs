using VirtualGallery.Api.DTOs.Auth;
using VirtualGallery.Api.Models;

namespace VirtualGallery.Api.Services;

public interface ITokenService
{
    AuthResponseDto CreateToken(User user);
}