"""Create and validate a reloadable dynamic-INT8 SetFit model.

The SetFit classifier contains a SentenceTransformer encoder and a
scikit-learn classification head. Only the PyTorch encoder is quantized;
the classification head remains unchanged.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import numpy as np
import torch
from setfit import SetFitModel


def quantize_encoder(model: SetFitModel) -> SetFitModel:
    """Replace the BERT encoder with a dynamic INT8 version in memory."""
    transformer = model.model_body[0]
    transformer.auto_model = torch.ao.quantization.quantize_dynamic(
        transformer.auto_model,
        {torch.nn.Linear},
        dtype=torch.qint8,
    )
    return model


def save_quantized_model(model_path: Path, output_path: Path) -> None:
    """Save the quantized encoder state and metadata needed for reloading."""
    model = SetFitModel.from_pretrained(str(model_path))
    quantize_encoder(model)

    output_path.mkdir(parents=True, exist_ok=True)
    torch.save(
        model.model_body[0].auto_model.state_dict(),
        output_path / "encoder_quantized.pt",
    )
    (output_path / "metadata.json").write_text(
        json.dumps(
            {
                "base_model": str(model_path.resolve()),
                "quantization": "dynamic",
                "dtype": "qint8",
                "quantized_modules": ["torch.nn.Linear"],
            },
            indent=2,
        ),
        encoding="utf-8",
    )


def load_quantized_model(model_path: Path, quantized_path: Path) -> SetFitModel:
    """Load the original model structure and apply the saved INT8 encoder."""
    model = SetFitModel.from_pretrained(str(model_path))
    quantize_encoder(model)
    state_dict: dict[str, Any] = torch.load(
        quantized_path / "encoder_quantized.pt",
        map_location="cpu",
        weights_only=True,
    )
    model.model_body[0].auto_model.load_state_dict(state_dict)
    return model


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", type=Path, default=Path("saved_setfit_model"))
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("results") / "saved_setfit_model_int8",
    )
    parser.add_argument(
        "--text",
        action="append",
        default=None,
        help="Text to run after quantization. Repeat this option for more texts.",
    )
    args = parser.parse_args()
    texts = args.text or ["Paid Rs 450 at Sharma Tea Stall via PhonePe"]

    if not args.model.exists():
        raise FileNotFoundError(f"Model directory does not exist: {args.model}")

    original = SetFitModel.from_pretrained(str(args.model))
    original_predictions = np.asarray(original.predict(texts)).tolist()

    save_quantized_model(args.model, args.output)
    quantized = load_quantized_model(args.model, args.output)
    quantized_predictions = np.asarray(quantized.predict(texts)).tolist()

    print(f"Quantized model saved to: {args.output.resolve()}")
    print(f"Original predictions:  {original_predictions}")
    print(f"INT8 predictions:     {quantized_predictions}")
    if original_predictions != quantized_predictions:
        raise RuntimeError(
            "Quantization changed the predictions for the validation texts."
        )
    print("Validation passed: original and INT8 predictions match.")


if __name__ == "__main__":
    main()
