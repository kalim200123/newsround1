import { Request, Response, NextFunction } from 'express';

export const validateInquiry = (req: Request, res: Response, next: NextFunction) => {
    const { subject, content, privacy_agreement } = req.body;

    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
        return res.status(400).json({ field: 'subject', message: '문의 주제를 입력해주세요.' });
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ field: 'content', message: '문의 내용을 입력해주세요.' });
    }

    // multipart/form-data는 boolean을 string으로 전송하므로 'true' 문자열을 확인합니다.
    if (privacy_agreement !== 'true') {
        return res.status(400).json({ field: 'privacy_agreement', message: '개인정보 수집 및 이용에 동의해야 합니다.' });
    }

    next(); // 모든 유효성 검사 통과
};
