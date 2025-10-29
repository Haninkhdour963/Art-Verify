namespace ArtVerify.Application.Interfaces
{
    public interface IHederaService
    {
        Task<HederaTransactionResult> RegisterArtworkHashAsync(string hash, string fileName);
        Task<HederaTransactionResult> ProcessPurchaseAsync(string buyerAccountId, string sellerAccountId, decimal amountHbar);
        Task<HederaVerificationResult> VerifyArtworkByFileIdAsync(string fileId, string expectedHash);
        Task<HederaVerificationResult> VerifyArtworkByTransactionIdAsync(string transactionId, string expectedHash);
        Task<decimal> GetAccountBalanceAsync(string accountId);
    }

    public class HederaTransactionResult
    {
        public bool Success { get; set; }
        public string? FileId { get; set; }
        public string? TransactionId { get; set; }
        public string? Error { get; set; }
    }

    public class HederaVerificationResult
    {
        public bool Success { get; set; }
        public bool IsVerified { get; set; }
        public string? Error { get; set; }
        public string? FileContents { get; set; }
    }
}