import { Request, Response, NextFunction } from 'express';

export const validateUpdateUser = (req: Request, res: Response, next: NextFunction) => {
    const { nickname, phone, profile_image_url } = req.body;

    // 닉네임이 제출된 경우 유효성 검사
    if (nickname !== undefined) {
        const nicknameRegex = /^[a-zA-Z0-9가-힣]{3,10}$/;
        if (typeof nickname !== 'string' || !nicknameRegex.test(nickname)) {
            return res.status(400).json({ field: 'nickname', message: '닉네임은 3~10자의 한글, 영문, 숫자만 사용 가능합니다.' });
        }
    }

    // 휴대폰 번호가 제출된 경우 유효성 검사
    if (phone !== undefined) {
        const phoneRegex = /^\d+$/;
        if (typeof phone !== 'string' || !phoneRegex.test(phone)) {
            return res.status(400).json({ field: 'phone', message: '휴대폰 번호는 숫자만 입력해주세요.' });
        }
    }

    // 프로필 이미지 URL이 제출된 경우 유효성 검사
    if (profile_image_url !== undefined) {
        if (typeof profile_image_url !== 'string' || profile_image_url.trim().length === 0) {
            return res.status(400).json({ field: 'profile_image_url', message: '잘못된 프로필 이미지 URL입니다.' });
        }
    }

    next(); // 모든 유효성 검사 통과
};
